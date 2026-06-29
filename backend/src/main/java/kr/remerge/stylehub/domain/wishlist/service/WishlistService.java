package kr.remerge.stylehub.domain.wishlist.service;

import kr.remerge.stylehub.domain.product.entity.Product;
import kr.remerge.stylehub.domain.product.repository.ProductRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.domain.wishlist.dto.WishlistDto;
import kr.remerge.stylehub.domain.wishlist.entity.Wishlist;
import kr.remerge.stylehub.domain.wishlist.entity.WishlistFolder;
import kr.remerge.stylehub.domain.wishlist.repository.WishlistFolderRepository;
import kr.remerge.stylehub.domain.wishlist.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistFolderRepository wishlistFolderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // 폴더 목록 조회
    @Transactional(readOnly = true)
    public List<WishlistDto.FolderResponse> getFolders(Integer userId) {
        return wishlistFolderRepository.findByUser_UserIdOrderBySortOrder(userId)
                .stream()
                .map(f -> WishlistDto.FolderResponse.builder()
                        .wishlistFolderId(f.getWishlistFolderId())
                        .folderName(f.getFolderName())
                        .isDefault(f.getIsDefault())
                        .sortOrder(f.getSortOrder())
                        .itemCount(wishlistRepository.findByWishlistFolder_WishlistFolderId(f.getWishlistFolderId()).size())
                        .build())
                .toList();
    }

    // 폴더 생성 (없으면 기본 폴더도 자동 생성)
    @Transactional
    public WishlistDto.FolderResponse createFolder(Integer userId, String folderName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저 없음"));

        if (wishlistFolderRepository.existsByUser_UserIdAndFolderName(userId, folderName)) {
            throw new IllegalArgumentException("이미 존재하는 폴더명이에요");
        }

        int nextOrder = wishlistFolderRepository.findByUser_UserIdOrderBySortOrder(userId).size();

        WishlistFolder folder = WishlistFolder.builder()
                .user(user)
                .folderName(folderName)
                .sortOrder(nextOrder)
                .isDefault(false)
                .build();

        WishlistFolder saved = wishlistFolderRepository.save(folder);

        return WishlistDto.FolderResponse.builder()
                .wishlistFolderId(saved.getWishlistFolderId())
                .folderName(saved.getFolderName())
                .isDefault(saved.getIsDefault())
                .sortOrder(saved.getSortOrder())
                .itemCount(0)
                .build();
    }

    // 기본 폴더 없으면 자동 생성
    @Transactional
    public WishlistFolder getOrCreateDefaultFolder(User user) {
        return wishlistFolderRepository.findByUser_UserIdAndIsDefaultTrue(user.getUserId())
                .orElseGet(() -> wishlistFolderRepository.save(
                        WishlistFolder.builder()
                                .user(user)
                                .folderName("기본 폴더")
                                .sortOrder(0)
                                .isDefault(true)
                                .build()
                ));
    }

    // 찜 추가
    @Transactional
    public WishlistDto.ItemResponse addWishlist(Integer userId, WishlistDto.AddRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저 없음"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("상품 없음"));

        WishlistFolder folder = wishlistFolderRepository.findById(request.getWishlistFolderId())
                .orElseThrow(() -> new IllegalArgumentException("폴더 없음"));

        // 중복 체크
        if (wishlistRepository.findByWishlistFolder_WishlistFolderIdAndProduct_ProductId(
                folder.getWishlistFolderId(), product.getProductId()).isPresent()) {
            throw new IllegalArgumentException("이미 찜한 상품이에요");
        }

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .wishlistFolder(folder)
                .build();

        Wishlist saved = wishlistRepository.save(wishlist);

        return toItemResponse(saved);
    }

    // 찜 삭제
    @Transactional
    public void removeWishlist(Integer wishlistId) {
        wishlistRepository.deleteById(wishlistId);
    }

    // 내 찜 목록 전체 조회
    @Transactional(readOnly = true)
    public List<WishlistDto.ItemResponse> getMyWishlist(Integer userId) {
        return wishlistRepository.findByUser_UserId(userId)
                .stream()
                .map(this::toItemResponse)
                .toList();
    }

    // 특정 폴더 찜 목록
    @Transactional(readOnly = true)
    public WishlistDto.FolderWithItemsResponse getFolderItems(Integer folderId) {
        WishlistFolder folder = wishlistFolderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("폴더 없음"));

        List<WishlistDto.ItemResponse> items = wishlistRepository
                .findByWishlistFolder_WishlistFolderId(folderId)
                .stream()
                .map(this::toItemResponse)
                .toList();

        return WishlistDto.FolderWithItemsResponse.builder()
                .folder(WishlistDto.FolderResponse.builder()
                        .wishlistFolderId(folder.getWishlistFolderId())
                        .folderName(folder.getFolderName())
                        .isDefault(folder.getIsDefault())
                        .sortOrder(folder.getSortOrder())
                        .itemCount(items.size())
                        .build())
                .items(items)
                .build();
    }

    // ── 내부 변환 메서드 ──
    private WishlistDto.ItemResponse toItemResponse(Wishlist w) {
        return WishlistDto.ItemResponse.builder()
                .wishlistId(w.getWishlistId())
                .productId(w.getProduct().getProductId())
                .productName(w.getProduct().getProductName())
                .thumbnailUrl(null)                          // ← null로 임시처리
                .price(w.getProduct().getUnitPrice())        // ← unitPrice로 수정
                .brandName(w.getProduct().getBrand() != null ? w.getProduct().getBrand().getBrandName() : null)
                .folderName(w.getWishlistFolder().getFolderName())
                .build();
    }
}